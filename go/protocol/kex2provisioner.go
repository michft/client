// Auto-generated by avdl-compiler v1.1.0 (https://github.com/keybase/node-avdl-compiler)
//   Input file: avdl/kex2provisioner.avdl
//   Generated : Tue Mar 01 2016 11:09:12 GMT-0500 (EST)

package keybase1

import (
	rpc "github.com/keybase/go-framed-msgpack-rpc"
	context "golang.org/x/net/context"
)

type KexStartArg struct {
}

type Kex2ProvisionerInterface interface {
	KexStart(context.Context) error
}

func Kex2ProvisionerProtocol(i Kex2ProvisionerInterface) rpc.Protocol {
	return rpc.Protocol{
		Name: "keybase.1.Kex2Provisioner",
		Methods: map[string]rpc.ServeHandlerDescription{
			"kexStart": {
				MakeArg: func() interface{} {
					ret := make([]KexStartArg, 1)
					return &ret
				},
				Handler: func(ctx context.Context, args interface{}) (ret interface{}, err error) {
					err = i.KexStart(ctx)
					return
				},
				MethodType: rpc.MethodNotify,
			},
		},
	}
}

type Kex2ProvisionerClient struct {
	Cli rpc.GenericClient
}

func (c Kex2ProvisionerClient) KexStart(ctx context.Context) (err error) {
	err = c.Cli.Notify(ctx, "keybase.1.Kex2Provisioner.kexStart", []interface{}{KexStartArg{}})
	return
}